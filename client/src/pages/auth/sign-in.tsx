import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

const SignIn = () => {
  const { login, isLoggingIn } = useAuth();

  const formSchema = z.object({
    email: z.string().email("Invalid email").min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { watch } = form;
  const email = watch("email");
  const password = watch("password");
  const isFormFilled = email && password;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isLoggingIn) return;
    login(values);
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
              Welcome Back
            </CardTitle>
            <p className="text-muted-foreground text-sm sm:text-base">
              Sign in to continue to Gauss Chat
            </p>
          </CardHeader>
          <CardContent className="px-6 sm:px-8 pb-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="hello@gauss.com"
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
                  disabled={isLoggingIn || !isFormFilled}
                  type="submit"
                  className={cn(
                    "w-full h-11 text-base font-semibold transition-all duration-300 cursor-pointer",
                    isFormFilled && !isLoggingIn
                      ? "animate-in fade-in-50 duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                      : "opacity-50 cursor-not-allowed",
                  )}
                >
                  {isLoggingIn ? <Spinner className="mr-2" /> : null}
                  {isLoggingIn ? "Signing in..." : "Sign In"}
                </Button>

                <div className="text-center text-sm text-muted-foreground pt-2">
                  Don't have an account?{" "}
                  <Link
                    to="/sign-up"
                    className="text-primary font-medium hover:underline transition-all"
                  >
                    Create account
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

export default SignIn;
