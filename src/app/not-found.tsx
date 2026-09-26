import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1 className="text-4xl">That page is not here.</h1>
      <Link href="/" className="btn-primary mt-4">Back to the feed</Link>
    </div>
  );
}
