import movieType from "data/movie-type"

export default function SubType() {
    return <ul className="text-base group-hover:flex hidden absolute px-6 py-6 min-w-[35rem] right-0 bg-black h-60 flex-col flex-wrap z-10 gap-x-7 gap-y-4 before:absolute before:contents-[''] before:w-10 before:h-10 before:bg-black before:rotate-45 before:top-0 before:right-10 before:z-[-1]">
    {movieType.map((item) => (
      <li key={item.slug} className='hover:text-custome-red'><a href={`/movies/type/${item.slug}`}>{item.name}</a></li>
    ))}
  </ul>
}