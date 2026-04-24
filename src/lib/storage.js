import { supabase } from './supabase'

export const uploadFile = async (bucket, file, path) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${path}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file)

  if (uploadError) {
    throw uploadError
  }

  return filePath
}
