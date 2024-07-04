import { ApiError, HTTPValidationError } from "@/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";

export default function ApiErrorCard({ error }: { error: ApiError }) {
  const messages = (error.body as HTTPValidationError).detail?.map(
    (detail) => detail.msg
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error {error.status}</CardTitle>
        <CardDescription>{error.statusText}</CardDescription>
        <CardContent>
          {messages && (
            <ul>
              {messages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </CardHeader>
    </Card>
  );
}
