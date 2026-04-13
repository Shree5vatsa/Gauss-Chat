import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Logo from "@/components/logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "react-router-dom";
import { useState } from "react";
import { API } from "@/lib/axios-client";
import { cn } from "@/lib/utils";

const SignUp = () => {
  const { register, isSigningUp } = useAuth();
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

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
      // Email doesn't exist or error - proceed
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-md">
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center space-y-2 pt-8 pb-6">
            <div className="flex justify-center mb-4">
              <Logo imgClass="size-20 sm:size-24 md:size-28" showText={false} />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Create Account
            </CardTitle>
            <p className="text-muted-foreground text-sm sm:text-base">
              Join Gauss Chat and start messaging
            </p>
          </CardHeader>
          <CardContent className="px-6 sm:px-8 pb-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          First Name
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
                          Last Name
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
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="email"
                            placeholder="hello@gauss.com"
                            className="h-11 text-base pr-16"
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
                          placeholder="••••••"
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
                  className={cn(
                    "w-full h-11 text-base font-semibold transition-all duration-300 cursor-pointer mt-2",
                    isFormFilled && !isSigningUp && !emailError
                      ? "animate-in fade-in-50 duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                      : "opacity-50 cursor-not-allowed",
                  )}
                >
                  {isSigningUp && <Spinner className="mr-2" />}
                  {isSigningUp ? "Creating account..." : "Sign Up"}
                </Button>

                <div className="text-center text-sm text-muted-foreground pt-2">
                  Already have an account?{" "}
                  <Link
                    to="/"
                    className="text-primary font-medium hover:underline transition-all"
                  >
                    Sign in instead
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
