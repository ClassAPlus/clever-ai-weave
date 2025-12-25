import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 bg-gray-700" />
          <Skeleton className="h-4 w-72 mt-2 bg-gray-700/50" />
        </div>
        <Skeleton className="h-10 w-32 bg-gray-700" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general">
        <TabsList className="bg-gray-800/50 border border-gray-700">
          <TabsTrigger value="general" disabled className="data-[state=active]:bg-gray-700">
            <Skeleton className="h-4 w-16 bg-gray-600" />
          </TabsTrigger>
          <TabsTrigger value="ai" disabled>
            <Skeleton className="h-4 w-20 bg-gray-600" />
          </TabsTrigger>
          <TabsTrigger value="advanced" disabled>
            <Skeleton className="h-4 w-20 bg-gray-600" />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Cards */}
      <div className="space-y-6">
        {/* Business Info Card */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded bg-gray-700" />
              <Skeleton className="h-6 w-40 bg-gray-700" />
            </div>
            <Skeleton className="h-4 w-56 mt-1 bg-gray-700/50" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-gray-700/50" />
                  <Skeleton className="h-10 w-full bg-gray-700" />
                </div>
              ))}
            </div>
            <Skeleton className="h-12 w-full bg-gray-700/30 rounded-lg" />
          </CardContent>
        </Card>

        {/* Call Forwarding Card */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded bg-gray-700" />
              <Skeleton className="h-6 w-32 bg-gray-700" />
            </div>
            <Skeleton className="h-4 w-64 mt-1 bg-gray-700/50" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 bg-gray-700/50" />
              <Skeleton className="h-10 w-full bg-gray-700" />
              <Skeleton className="h-3 w-72 bg-gray-700/30" />
            </div>
          </CardContent>
        </Card>

        {/* Business Hours Card */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded bg-gray-700" />
              <Skeleton className="h-6 w-36 bg-gray-700" />
            </div>
            <Skeleton className="h-4 w-48 mt-1 bg-gray-700/50" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-5 rounded bg-gray-700" />
                <Skeleton className="h-4 w-20 bg-gray-700/50" />
                <Skeleton className="h-8 w-24 bg-gray-700" />
                <Skeleton className="h-4 w-4 bg-gray-700/50" />
                <Skeleton className="h-8 w-24 bg-gray-700" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded bg-gray-700" />
              <Skeleton className="h-6 w-28 bg-gray-700" />
            </div>
            <Skeleton className="h-4 w-52 mt-1 bg-gray-700/50" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 bg-gray-700/50" />
                  <Skeleton className="h-3 w-48 bg-gray-700/30" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full bg-gray-700" />
              </div>
            ))}
            <div className="pt-4 border-t border-gray-700 space-y-2">
              <Skeleton className="h-4 w-36 bg-gray-700/50" />
              <Skeleton className="h-10 w-full bg-gray-700" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
