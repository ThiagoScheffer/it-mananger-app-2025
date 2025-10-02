
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      exportBackupToFile();
      toast.success('Backup exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar backup: ' + (error as Error).message);
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
            toast.error('Arquivo de backup contém erros de validação - metadata');
             setValidationResult({
            isValid: false,
            errors: ['Formato de arquivo inválido'],
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
            toast.success('Arquivo de backup validado com sucesso!');
          } else {
            toast.error('Arquivo de backup contém erros de validação');
          }
        } catch (error) {
          toast.error('Arquivo de backup inválido');
          setValidationResult({
            isValid: false,
            errors: ['Formato de arquivo inválido'],
            warnings: [],
            stats: null
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      toast.error('Erro ao ler arquivo: ' + (error as Error).message);
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
        toast.success('Backup importado com sucesso!');
        if (!isDryRun) {
          // Refresh application data
          setTimeout(() => {
            //refreshAllData();
            window.location.reload(); // Force full reload to ensure all contexts are updated
          }, 1000);
        }
      } else {
        toast.error('Falha na importação do backup');
      }
    } catch (error) {
      toast.error('Erro durante importação: ' + (error as Error).message);
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
          <h1 className="text-3xl font-bold">Backup e Restauração</h1>
          <p className="text-muted-foreground">Gerencie backups dos dados da aplicação</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          {backupStats?.totalRecords || 0} registros
        </Badge>
      </div>

      {/* Current Data Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estatísticas dos Dados Atuais
          </CardTitle>
          <CardDescription>
            Visão geral dos dados que serão incluídos no backup
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{backupStats.services}</div>
                <div className="text-sm text-muted-foreground">Serviços</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{backupStats.clients}</div>
                <div className="text-sm text-muted-foreground">Clientes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{backupStats.materials}</div>
                <div className="text-sm text-muted-foreground">Materiais</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{backupStats.installments}</div>
                <div className="text-sm text-muted-foreground">Parcelas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{backupStats.expenses}</div>
                <div className="text-sm text-muted-foreground">Despesas</div>
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
              Exportar Backup
            </CardTitle>
            <CardDescription>
              Criar e baixar backup completo dos dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Incluído no backup:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Dados de clientes, serviços e técnicos</li>
                <li>• Materiais e movimentação de estoque</li>
                <li>• Parcelas e dados financeiros</li>
                <li>• Despesas e pedidos</li>
                <li>• Configurações e metadados</li>
              </ul>
            </div>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? 'Exportando...' : 'Exportar Backup'}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Backup
            </CardTitle>
            <CardDescription>
              Restaurar dados de um arquivo de backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="backup-file" className="text-sm font-medium">
                Selecionar arquivo de backup:
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
                Simulação (não alterar dados)
              </label>
            </div>

            {previewData && (
              <Alert>
                <AlertDescription>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <strong>{previewData.metadata.version}</strong>
                    <span className="text-muted-foreground">
                      {new Date(previewData.metadata.exportDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {validationResult && (
                    <Badge 
                      variant={getStatusColor(validationResult.isValid, validationResult.warnings.length > 0)}
                      className="flex items-center gap-1 w-fit"
                    >
                      {getStatusIcon(validationResult.isValid, validationResult.warnings.length > 0)}
                      {validationResult.isValid ? 'Válido' : 'Inválido'}
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
              {isImporting ? 'Importando...' : `${isDryRun ? 'Simular' : 'Importar'} Backup`}
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
                <span>Progresso da importação</span>
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
              Resultado da Validação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(validationResult.isValid, validationResult.warnings.length > 0)}
              <span className="font-medium">
                {validationResult.isValid ? 'Backup válido' : 'Backup inválido'}
              </span>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Erros:</h4>
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
                <h4 className="font-medium text-yellow-600">Avisos:</h4>
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
                <h4 className="font-medium">Estatísticas do backup:</h4>
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
              Resultado da Importação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {importResult.success ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {importResult.isDryRun ? 
                    'Simulação concluída com sucesso! Nenhum dado foi alterado.' :
                    'Backup importado com sucesso! A aplicação será recarregada.'
                  }
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Falha na importação do backup. Verifique os erros abaixo.
                </AlertDescription>
              </Alert>
            )}

            {Object.keys(importResult.importedCounts).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Registros processados:</h4>
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
                <h4 className="font-medium text-destructive">Erros:</h4>
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
              Backups Automáticos
            </CardTitle>
            <CardDescription>
              Backups criados automaticamente pelo sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {automaticBackups.slice(0, 5).map((backup) => (
                <div key={backup.key} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">
                    {new Date(backup.date).toLocaleDateString('pt-BR')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const result = restoreFromAutomaticBackup(backup.key);
                      if (result.success) {
                        toast.success('Backup automático restaurado!');
                        setTimeout(() => window.location.reload(), 1000);
                      } else {
                        toast.error('Erro ao restaurar backup: ' + result.errors.join(', '));
                      }
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restaurar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
