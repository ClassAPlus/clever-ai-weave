import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, Bot, Shield, ArrowLeft, Mail, CheckCircle2, RefreshCw } from "lucide-react";

export default function Auth() {
  const { user, signIn, signUp, loading, resendConfirmation, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const getSignInErrorMessage = (error: Error): { title: string; description: string } => {
    const message = error.message.toLowerCase();
    
    if (message.includes("invalid login credentials") || message.includes("invalid_credentials")) {
      return {
        title: "Invalid credentials",
        description: "The email or password you entered is incorrect. Please try again.",
      };
    }
    if (message.includes("email not confirmed")) {
      return {
        title: "Email not verified",
        description: "Please check your inbox and click the confirmation link we sent you.",
      };
    }
    if (message.includes("too many requests")) {
      return {
        title: "Too many attempts",
        description: "Please wait a few minutes before trying again.",
      };
    }
    return {
      title: "Sign in failed",
      description: error.message,
    };
  };

  const getSignUpErrorMessage = (error: Error): { title: string; description: string } => {
    const message = error.message.toLowerCase();
    
    if (message.includes("already registered") || message.includes("already been registered")) {
      return {
        title: "Email already exists",
        description: "This email is already registered. Try signing in instead, or use a different email.",
      };
    }
    if (message.includes("password") && message.includes("6")) {
      return {
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
      };
    }
    if (message.includes("invalid email")) {
      return {
        title: "Invalid email",
        description: "Please enter a valid email address.",
      };
    }
    return {
      title: "Sign up failed",
      description: error.message,
    };
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      const { title, description } = getSignInErrorMessage(error);
      toast({
        variant: "destructive",
        title,
        description,
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      navigate("/dashboard");
    }
    
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await signUp(email, password);
    
    if (error) {
      const { title, description } = getSignUpErrorMessage(error);
      toast({
        variant: "destructive",
        title,
        description,
      });
    } else {
      setSignUpEmail(email);
      setSignUpSuccess(true);
    }
    
    setIsSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await resetPassword(forgotEmail);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to send reset email",
        description: error.message,
      });
    } else {
      setForgotPasswordSent(true);
    }
    
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex relative">
      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="absolute left-4 top-4 text-gray-400 hover:text-white hover:bg-gray-700/50 z-10"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Left side - Features */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4">
            AI Missed Call System
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Never lose a customer again. Our AI handles missed calls with intelligent voice and SMS responses.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Phone className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Your Own Phone Number</h3>
                <p className="text-gray-400">Get a dedicated Israeli phone number for your business</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Bot className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Voice & SMS</h3>
                <p className="text-gray-400">Automated voice responses and SMS conversations in Hebrew & English</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Shield className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Full Control</h3>
                <p className="text-gray-400">Monitor conversations, manage appointments, get instant alerts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        {showForgotPassword ? (
          <Card className="w-full max-w-md bg-gray-800/50 border-gray-700">
            <CardContent className="pt-8 pb-8">
              {forgotPasswordSent ? (
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-green-500/20 rounded-full">
                    <Mail className="h-12 w-12 text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Check Your Email</h2>
                    <p className="text-gray-400">
                      We sent a password reset link to
                    </p>
                    <p className="text-purple-400 font-medium">{forgotEmail}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-4 mt-4">
                    <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-300 text-left">
                      Click the link in the email to reset your password. Check spam folder if you don't see it.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordSent(false);
                      setForgotEmail("");
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-purple-500/20 rounded-full">
                    <Mail className="h-12 w-12 text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Reset Password</h2>
                    <p className="text-gray-400">
                      Enter your email and we'll send you a link to reset your password.
                    </p>
                  </div>
                  <form onSubmit={handleForgotPassword} className="w-full space-y-4 mt-4">
                    <div className="space-y-2 text-left">
                      <Label htmlFor="forgot-email" className="text-gray-300">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotEmail("");
                      }}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Sign In
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        ) : signUpSuccess ? (
          <Card className="w-full max-w-md bg-gray-800/50 border-gray-700">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-green-500/20 rounded-full">
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Account Created!</h2>
                  <p className="text-gray-400">
                    We sent a confirmation email to
                  </p>
                  <p className="text-purple-400 font-medium">{signUpEmail}</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-4 mt-4">
                  <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-300 text-left">
                    Please check your inbox (and spam folder) and click the link to activate your account.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={async () => {
                      setIsResending(true);
                      const { error } = await resendConfirmation(signUpEmail);
                      if (error) {
                        toast({
                          variant: "destructive",
                          title: "Failed to resend",
                          description: error.message.includes("rate") 
                            ? "Please wait a minute before requesting another email."
                            : error.message,
                        });
                      } else {
                        toast({
                          title: "Email sent!",
                          description: "We've sent another confirmation email.",
                        });
                      }
                      setIsResending(false);
                    }}
                    disabled={isResending}
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend Email
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                    onClick={() => {
                      setSignUpSuccess(false);
                      setEmail("");
                      setPassword("");
                    }}
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md bg-gray-800/50 border-gray-700">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Welcome</CardTitle>
              <CardDescription className="text-gray-400">
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-700/50">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-purple-600">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-purple-600">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-gray-300">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password" className="text-gray-300">Password</Label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setForgotEmail(email);
                          }}
                          className="text-sm text-purple-400 hover:text-purple-300 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-gray-300">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-gray-300">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
