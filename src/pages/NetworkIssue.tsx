import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { WifiOff } from "lucide-react";
import { Link } from "react-router-dom";

export default function NetworkIssue() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark px-4">
      <div className="w-full max-w-md">
        <Card className="glass-modern hover-glow">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 rounded-full bg-red-500/10 p-3 w-fit">
              <WifiOff className="h-6 w-6 text-red-500" />
            </div>
            <CardTitle>Network connection required</CardTitle>
            <CardDescription>
              You appear to be offline. Please check your internet connection and try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to="/">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


