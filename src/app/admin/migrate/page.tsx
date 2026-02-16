'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function MigratePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleMigration = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'An unknown error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold tracking-tight font-headline">Data Migration</h1>
      <Card>
        <CardHeader>
          <CardTitle>Seed Initial Software Data</CardTitle>
          <CardDescription>
            Run a one-time script to populate the Firestore database with the initial set of software products.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Click the button below to start the migration process. This will populate the `softwareProducts` collection in Firestore with the data from the initial placeholder file. This should only be done once to set up the app. New partner and inquiry data is added directly from the forms on the live site and does not require migration.
          </p>
          <Button onClick={handleMigration} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migrating Software Data...
              </>
            ) : (
              'Run Software Migration'
            )}
          </Button>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
