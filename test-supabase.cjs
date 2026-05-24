const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vbgzdwackgulyibkggri.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZ3pkd2Fja2d1bHlpYmtnZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjU5ODMsImV4cCI6MjA5MzIwMTk4M30.nNoM5J7cw27W2iTBMluGpWgiecx3rmPLXc0ul5U2h60'
);

async function test() {
  const { data, error } = await supabase.from('Sales_Details').select('*').limit(1);  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', data);
  }
}

test();
