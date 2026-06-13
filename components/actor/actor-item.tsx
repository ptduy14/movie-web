import Actor from 'types/actor';
import ActorImgDefault from '../../public/default-actor-img.jpg';
import Image from 'next/image';

/**
 * Cast member card — now clickable.
 *
 * OPhim has no person/filmography endpoint and its in-app search is title-only
 * (searching an actor name dead-ends), so we link out to TMDB for a real
 * filmography: credited cast → the person page, bare-name actors → a TMDB
 * person search. Opens in a new tab.
 */
export default function ActorItem({ actor }: { actor: Actor | string }) {
  const name = typeof actor === 'string' ? actor : actor.name;
  const character = typeof actor === 'string' ? undefined : actor.character;
  const imgSrc =
    typeof actor !== 'string' && actor.profile_path
      ? `${process.env.NEXT_PUBLIC_TMDB_IMG_DOMAIN}/t/p/w300${actor.profile_path}`
      : ActorImgDefault;
  const href =
    typeof actor === 'string'
      ? `https://www.themoviedb.org/search?query=${encodeURIComponent(actor)}`
      : `https://www.themoviedb.org/person/${actor.id}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={name}
      className="group block w-full text-center"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-full ring-2 ring-transparent transition-all duration-200 group-hover:ring-brand">
        <Image
          src={imgSrc}
          alt={name}
          fill
          className="object-cover object-center transition-transform duration-200 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="mt-3 transition-colors group-hover:text-brand">{name}</div>
      {character && <div className="text-sm text-gray-400">{character}</div>}
    </a>
  );
}
