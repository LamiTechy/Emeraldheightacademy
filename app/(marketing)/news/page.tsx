import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listPublicNews } from "@/lib/queries/public";
import { formatDate } from "@/lib/format";
import { ArrowRightIcon, NewspaperIcon } from "lucide-react";

export const metadata = { title: "News" };

/** News posts come from the database — render on demand. */
export const instant = false;

export default async function NewsPage() {
  const articles = await listPublicNews(24);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">News</h1>
        <p className="mt-2 text-muted-foreground">
          Announcements, results and stories from the centre.
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <NewspaperIcon className="size-4" /> No news published yet — check back soon.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link key={a.id} href={`/news/${a.slug}`} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/50">
                {a.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.coverImageUrl}
                    alt=""
                    className="aspect-video w-full rounded-t-xl object-cover"
                  />
                ) : null}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {a.publishedAt ? formatDate(a.publishedAt) : null}
                  </div>
                  <CardTitle className="text-base leading-snug">{a.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {a.excerpt ?? a.body.slice(0, 160)}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Read more <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
