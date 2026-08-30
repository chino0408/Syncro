/* Syncro — config.js
   Datos de conexión con Supabase.

   La clave "anon" está pensada para viajar en el navegador: no es un
   secreto. Lo que protege la información son las políticas de seguridad
   por fila definidas en la base (03-auth-y-seguridad.sql), que deciden
   qué filas puede ver cada quien.

   La clave "service_role" NUNCA va acá ni en ningún archivo del
   repositorio: esa se salta todas las políticas. */

const SUPABASE_URL = 'https://niwtbquypefjubovwinq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pd3RicXV5cGVmanVib3Z3aW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMjY1ODIsImV4cCI6MjEwMzcwMjU4Mn0.6Y4uthhjmlSj7ddSPndqZhECZcrvA_fJG2LBmkl3aPw';
