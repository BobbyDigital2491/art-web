import { Suspense } from 'react';
import NewProjectForm from './NewProjectForm';

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-100">Loading form...</div>}>
      <NewProjectForm />
    </Suspense>
  );
}