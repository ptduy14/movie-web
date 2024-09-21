export default interface Actor {
    adult: boolean;
    gender: number; // 1 for female, 2 for male
    id: number;
    known_for_department: string;
    name: string;
    original_name: string;
    popularity: number;
    profile_path: string | null; // The path to the actor's image or null if not available
    cast_id: number;
    character: string;
    credit_id: string;
    order: number;
  }
  