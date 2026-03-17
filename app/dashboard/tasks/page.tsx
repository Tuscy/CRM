import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <Card>
        <CardHeader>
          <CardTitle>Follow-ups & tasks</CardTitle>
          <p className="text-sm text-muted-foreground">
            Task management per lead — coming soon.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tasks are linked to leads in the database. Add task CRUD and list
            view here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
