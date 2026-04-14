import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "react-router-dom";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState, useEffect } from "react";
import { API } from "@/lib/axios-client";
import { useTheme } from "@/components/theme-provider";
import bgImageLight from "@/assets/bg1.jpg";
import bgImageDark from "@/assets/bg1dark.jpg";

const SignUp = () => {
  const { register, isSigningUp } = useAuth();
  const { theme } = useTheme();
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState(bgImageLight);

  useEffect(() => {
    setBgImage(theme === "dark" ? bgImageDark : bgImageLight);
  }, [theme]);

  const formSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email").min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const { watch } = form;
  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const email = watch("email");
  const password = watch("password");
  const isFormFilled =
    firstName && lastName && email && password && !emailError;

  const emailValue = form.watch("email");

  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes("@")) return;

    setIsEmailChecking(true);
    setEmailError(null);

    try {
      const response = await API.get(`/user/check-email?email=${email}`);
      if (response.data.exists) {
        setEmailError("Email already registered. Please sign in instead.");
      }
    } catch (error) {
      console.log("Email available");
    } finally {
      setIsEmailChecking(false);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isSigningUp) return;
    if (emailError) return;

    register({
      name: `${values.firstName} ${values.lastName}`,
      email: values.email,
      password: values.password,
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form Section (Full width) */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-lg">
          <Card className="border shadow-xl rounded-2xl">
            <CardContent className="p-8 space-y-8">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <Logo imgClass="size-16" showText={false} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Create an account
                </h1>
                <p className="text-muted-foreground text-base mt-2">
                  Join Gauss Chat and start messaging
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            First name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John"
                              className="h-11 text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Last name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              className="h-11 text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Email address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="email"
                              placeholder="hello@gauss.com"
                              className="h-11 text-base pr-14"
                              {...field}
                              onBlur={() => checkEmailExists(emailValue)}
                            />
                            {isEmailChecking && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Spinner className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        {emailError && (
                          <p className="text-sm text-destructive mt-1">
                            {emailError}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Create a strong password"
                            className="h-11 text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    disabled={
                      isSigningUp ||
                      isEmailChecking ||
                      !!emailError ||
                      !isFormFilled
                    }
                    type="submit"
                    className="w-full h-11 text-base mt-4"
                  >
                    {isSigningUp && <Spinner className="mr-2 w-4 h-4" />}
                    {isSigningUp ? "Creating account..." : "Sign up"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground pt-2">
                    Already have an account?{" "}
                    <Link
                      to="/"
                      className="text-primary font-medium hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Only Image */}
      <div
        className="hidden lg:flex flex-1 relative"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </div>
  );
};

export default SignUp;
