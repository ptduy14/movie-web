export default function Trailer({ trailer }: { trailer: string }) {
  const formatTrailerURL = trailer.replace('watch?v=', 'embed/');
  return (
    <div className="space-y-3">
      <div className="uppercase font-bold">trailer</div>
      <div className="w-full h-96">
        <iframe src={formatTrailerURL} className="w-full h-full"></iframe>
      </div>
    </div>
  );
}
