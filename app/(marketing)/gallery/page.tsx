import { Card, CardContent } from "@/components/ui/card";
import { listPublicGallery } from "@/lib/queries/public";
import { ImagesIcon } from "lucide-react";

export const metadata = { title: "Gallery" };

/** Gallery items come from the database — render on demand. */
export const instant = false;

export default async function GalleryPage() {
  const items = await listPublicGallery(36);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Gallery</h1>
        <p className="mt-2 text-muted-foreground">
          Moments from classes, events and celebrations at the centre.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImagesIcon className="size-4" /> Photos coming soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((g) => (
            <Card key={g.id} className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.imageUrl}
                alt={g.title}
                className="aspect-square w-full object-cover transition-transform hover:scale-105"
              />
              <CardContent className="p-3">
                <p className="truncate text-sm font-medium">{g.title}</p>
                {g.caption ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{g.caption}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
