import ApiTest from '@/components/ApiTest';

export default function ApiTestPage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Pengujian Koneksi Frontend-Backend
      </h1>
      <ApiTest />
    </main>
  );
} 