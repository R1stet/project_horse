'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  // Extract Turnstile token from form data
  const captchaToken = formData.get('cf-turnstile-response') as string
  
  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      captchaToken: captchaToken // Add the captcha token to options
    }
  }
  
  const { error } = await supabase.auth.signInWithPassword(data)
  if (error) {
    redirect('/error')
  }
  
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  
  // Extract Turnstile token from form data
  const captchaToken = formData.get('cf-turnstile-response') as string
  
  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
      },
      captchaToken: captchaToken // Add the captcha token to options
    }
  }
  
  const { error } = await supabase.auth.signUp(data)
  if (error) {
    redirect('/error')
  }
  
  revalidatePath('/', 'layout')
  redirect('/')
}