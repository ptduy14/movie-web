/** One season of a series, as a link to its own title (the catalog lists each season separately). */
export default interface SeasonLink {
  slug: string;
  name: string;
  season: number;
}
