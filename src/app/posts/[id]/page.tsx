import { PostScreen } from "@/components/more-screens";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostScreen postId={id} />;
}
