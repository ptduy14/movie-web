export default function Trailer({ trailer }: { trailer: string }) {
  const formatTrailerURL = trailer.replace('watch?v=', 'embed/');
  return (
    <div className="space-y-3">
      <div className="uppercase font-bold">Trailer</div>
      <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-black">
        <iframe
          src={formatTrailerURL}
          title="Trailer"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        ></iframe>
      </div>
    </div>
  );
}
