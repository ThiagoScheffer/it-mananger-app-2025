
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  Upload,
  Shield,
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '@/context/AppContext';
import {
  createBackup,
  exportBackupToFile,
  importBackupFromFile,
  validateBackup,
  getAutomaticBackups,
  restoreFromAutomaticBackup,
  BackupData,
  BackupValidationResult,
  BackupImportResult
} from '@/utils/backupManager';
import { seedDatabase } from '@/utils/storageManager';

interface BackupStats {
  users: number;
  clients: number;
  materials: number;
  technicians: number;
  services: number;
  installments: number;
  expenses: number;
  orders: number;
  appointments: number;
  stockMovements: number;
  totalRecords: number;
}

export default function BackupPage() {
  //const { refreshAllData } = useAppContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<BackupImportResult | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<BackupData | null>(null);
  const [isDryRun, setIsDryRun] = useState(true);
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);

  // Calculate current data statistics
  React.useEffect(() => {
    const backup = createBackup();
    const stats: BackupStats = {
      users: backup.data.users.length,
      clients: backup.data.clients.length,
      materials: backup.data.materials.length,
      technicians: backup.data.technicians.length,
      services: backup.data.services.length,
      installments: backup.data.installments.length,
      expenses: backup.data.expenses.length,
      orders: backup.data.orders.length,
      appointments: backup.data.appointments.length,
      stockMovements: backup.data.stockMovements?.length || 0,
      totalRecords: 0
    };
    stats.totalRecords = Object.values(stats).reduce((sum, count) => typeof count === 'number' ? sum + count : sum, 0) - 1; // Exclude totalRecords itself
    setBackupStats(stats);
  }, []);

  // ... imports

  const handleExport = async () => {
    setIsExporting(true);
    try {
      exportBackupToFile();
      toast.success('Backup exported successfully!');
    } catch (error) {
      toast.error('Error exporting backup: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportResult(null);
    setValidationResult(null);
    setPreviewData(null);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const backup: BackupData = JSON.parse(content);
          if (!backup || !backup.metadata || !backup.data) {
            toast.error('Backup file validation error - metadata');
            setValidationResult({
              isValid: false,
              errors: ['Invalid file format'],
              warnings: [],
              stats: null
            });

            return;
          }

          setPreviewData(backup);

          // Validate backup
          const validation = validateBackup(backup);
          setValidationResult(validation);

          if (validation.isValid) {
            toast.success('Backup file validated successfully!');
          } else {
            toast.error('Backup file contains validation errors');
          }
        } catch (error) {
          toast.error('Invalid backup file');
          setValidationResult({
            isValid: false,
            errors: ['Invalid file format'],
            warnings: [],
            stats: null
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      toast.error('Error reading file: ' + (error as Error).message);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await importBackupFromFile(selectedFile);
      clearInterval(progressInterval);
      setImportProgress(100);

      setImportResult(result);

      if (result.success) {
        toast.success('Backup imported successfully!');
        if (!isDryRun) {
          // Refresh application data
          setTimeout(() => {
            //refreshAllData();
            window.location.reload(); // Force full reload to ensure all contexts are updated
          }, 1000);
        }
      } else {
        toast.error('Backup import failed');
      }
    } catch (error) {
      toast.error('Error during import: ' + (error as Error).message);
      setImportResult({
        success: false,
        errors: [(error as Error).message],
        warnings: [],
        importedCounts: {},
        skippedCounts: {},
        isDryRun
      });
    } finally {
      setIsImporting(false);
    }
  };
  // ...
  const getStatusIcon = (isValid: boolean, hasWarnings: boolean) => {
    if (!isValid) return <XCircle className="h-4 w-4 text-destructive" />;
    if (hasWarnings) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = (isValid: boolean, hasWarnings: boolean) => {
    if (!isValid) return 'destructive';
    if (hasWarnings) return 'secondary';
    return 'default';
  };

  const automaticBackups = getAutomaticBackups();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Backup & Restore</h1>
          <p className="text-muted-foreground">Manage application data backups</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          {backupStats?.totalRecords || 0} records
        </Badge>
      </div>

      {/* Current Data Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Current Data Statistics
          </CardTitle>
          <CardDescription>
            Overview of data to be included in the backup
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{backupStats.services}</div>
                <div className="text-sm text-muted-foreground">Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{backupStats.clients}</div>
                <div className="text-sm text-muted-foreground">Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{backupStats.materials}</div>
                <div className="text-sm text-muted-foreground">Materials</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{backupStats.installments}</div>
                <div className="text-sm text-muted-foreground">Installments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{backupStats.expenses}</div>
                <div className="text-sm text-muted-foreground">Expenses</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Backup
            </CardTitle>
            <CardDescription>
              Create and download a full data backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Included in backup:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Clients, services, and technicians data</li>
                <li>• Materials and stock movements</li>
                <li>• Installments and financial data</li>
                <li>• Expenses and orders</li>
                <li>• Settings and metadata</li>
              </ul>
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? 'Exporting...' : 'Export Backup'}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Backup
            </CardTitle>
            <CardDescription>
              Restore data from a backup file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="backup-file" className="text-sm font-medium">
                Select backup file:
              </label>
              <input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dry-run"
                checked={isDryRun}
                onChange={(e) => setIsDryRun(e.target.checked)}
              />
              <label htmlFor="dry-run" className="text-sm">
                Dry Run (Simulation)
              </label>
            </div>

            {previewData && (
              <Alert>
                <AlertDescription>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <strong>{previewData.metadata.version}</strong>
                    <span className="text-muted-foreground">
                      {new Date(previewData.metadata.exportDate).toLocaleDateString()}
                    </span>
                  </div>
                  {validationResult && (
                    <Badge
                      variant={getStatusColor(validationResult.isValid, validationResult.warnings.length > 0)}
                      className="flex items-center gap-1 w-fit"
                    >
                      {getStatusIcon(validationResult.isValid, validationResult.warnings.length > 0)}
                      {validationResult.isValid ? 'Valid' : 'Invalid'}
                    </Badge>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleImport}
              disabled={isImporting || !selectedFile || !validationResult?.isValid}
              className="w-full"
              variant={isDryRun ? "outline" : "default"}
            >
              {isImporting ? 'Importing...' : `${isDryRun ? 'Simulate' : 'Import'} Backup`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Import Progress */}
      {isImporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Import Progress</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Validation Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(validationResult.isValid, validationResult.warnings.length > 0)}
              <span className="font-medium">
                {validationResult.isValid ? 'Valid Backup' : 'Invalid Backup'}
              </span>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Errors:</h4>
                <ul className="space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} className="text-sm text-destructive flex items-center gap-2">
                      <XCircle className="h-3 w-3" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-600">Warnings:</h4>
                <ul className="space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-600 flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.stats && (
              <div className="space-y-2">
                <h4 className="font-medium">Backup Statistics:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {Object.entries(validationResult.stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              Import Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {importResult.success ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {importResult.isDryRun ?
                    'Simulation completed successfully! No data was changed.' :
                    'Backup imported successfully! Application will reload.'
                  }
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Backup import failed. Check errors below.
                </AlertDescription>
              </Alert>
            )}

            {Object.keys(importResult.importedCounts).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Processed records:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {Object.entries(importResult.importedCounts).map(([table, count]) => (
                    <div key={table} className="flex justify-between">
                      <span className="capitalize">{table}:</span>
                      <span className="font-medium text-green-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Errors:</h4>
                <ul className="space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index} className="text-sm text-destructive">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Automatic Backups */}
      {automaticBackups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Automatic Backups
            </CardTitle>
            <CardDescription>
              Backups automatically created by the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {automaticBackups.slice(0, 5).map((backup) => (
                <div key={backup.key} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">
                    {new Date(backup.date).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const result = restoreFromAutomaticBackup(backup.key);
                        if (result.success) {
                          toast.success('Automatic backup restored!');
                          setTimeout(() => window.location.reload(), 1000);
                        } else {
                          toast.error('Error restoring backup: ' + result.errors.join(', '));
                        }
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Development Tools */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Tools for generating test data (WARNING: Replaces existing data)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm('WARNING: This will erase ALL current data and replace it with randomly generated test data. This action cannot be undone. Do you want to continue?')) {
                seedDatabase();
              }
            }}
            className="w-full"
          >
            Generate Test Data (Mock Data)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
