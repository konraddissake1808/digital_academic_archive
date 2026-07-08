import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface ResourceCardProps {
  id: string;
  title: string;
  description: string;
  price: number | string | { toString(): string };
  isFree: boolean;
  categoryName: string;
  subjectName?: string | null;
  fileType?: string | null;
  authorName?: string | null;
  institution?: string | null;
}

export function ResourceCard({
  id,
  title,
  description,
  price,
  isFree,
  categoryName,
  subjectName,
  fileType,
  authorName,
  institution,
}: ResourceCardProps) {
  return (
    <Link href={`/resources/${id}`}>
      <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="info">{categoryName}</Badge>
            {subjectName && <Badge variant="default">{subjectName}</Badge>}
            {fileType && <Badge>{fileType.toUpperCase()}</Badge>}
          </div>

          <h3 className="font-semibold text-gray-900 line-clamp-2">{title}</h3>

          <p className="text-sm text-gray-600 line-clamp-3">{description}</p>
        </CardContent>

        <CardFooter className="justify-between">
          <span className={`text-sm font-medium ${isFree ? "text-green-600" : "text-gray-900"}`}>
            {formatPrice(price)}
          </span>
          {authorName && (
            <span className="text-xs text-gray-500">
              by {authorName}
              {institution && <> · {institution}</>}
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
