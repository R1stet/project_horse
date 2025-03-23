'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Helper function to verify the Turnstile token
async function verifyTurnstileToken(token: string, remoteip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw new Error('Turnstile secret key is not defined');
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      secret,
      response: token,
      ...(remoteip ? { remoteip } : {})
    }),
  });

  const data = await res.json();
  return data.success;
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  
  // Extract Turnstile token from form data
  const captchaToken = formData.get('cf-turnstile-response') as string;
  
  // Verify the captcha token
  const isCaptchaValid = await verifyTurnstileToken(captchaToken);
  if (!isCaptchaValid) {
    throw new Error('Turnstile verification failed');
  }
  
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      captchaToken: captchaToken
    }
  };

  const { error } = await supabase.auth.signInWithPassword(data);
  if (error) {
    redirect('/error');
  }
  
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  
  // Extract Turnstile token from form data
  const captchaToken = formData.get('cf-turnstile-response') as string;
  
  // Verify the captcha token
  const isCaptchaValid = await verifyTurnstileToken(captchaToken);
  if (!isCaptchaValid) {
    throw new Error('Turnstile verification failed');
  }
  
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
      },
      captchaToken: captchaToken
    }
  };

  const { error } = await supabase.auth.signUp(data);
  if (error) {
    redirect('/error');
  }
  
  revalidatePath('/', 'layout');
  redirect('/');
}