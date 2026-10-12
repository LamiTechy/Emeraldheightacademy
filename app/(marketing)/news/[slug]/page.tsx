import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getPublicNewsBySlug } from "@/lib/queries/public";
import { formatDate } from "@/lib/format";
import { ArrowLeftIcon } from "lucide-react";

export const metadata = { title: "News" };

/** Article body comes from the database — render on demand. */
export const instant = false;

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublicNewsBySlug(slug);
  if (!article) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link href="/news">
          <ArrowLeftIcon /> All news
        </Link>
      </Button>

      <article className="space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {article.publishedAt ? <span>{formatDate(article.publishedAt)}</span> : null}
            {article.author ? (
              <>
                <span>·</span>
                <span>{article.author.name}</span>
              </>
            ) : null}
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {article.title}
          </h1>
          {article.excerpt ? (
            <p className="text-lg text-muted-foreground">{article.excerpt}</p>
          ) : null}
        </header>

        {article.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImageUrl}
            alt=""
            className="w-full rounded-xl object-cover"
          />
        ) : null}

        <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-base leading-relaxed">
          {article.body}
        </div>
      </article>
    </div>
  );
}
