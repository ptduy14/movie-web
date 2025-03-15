import { auth, db } from 'lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = auth.currentUser;

    if (user) {
      await setDoc(doc(db, "Users", user.uid), {
        email: user.email,
        name: data.name,
        photo: ''
      })
    }
    
    return NextResponse.json(
      {
        user,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message || 'Something went wrong',
      },
      { status: 500 }
    );
  }
}
