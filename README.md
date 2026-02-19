# Deep Breath Extension

## Segurança e Privacidade

### Dados Coletados
- **NENHUM dado é coletado ou transmitido** para servidores externos
- Todas as configurações são armazenadas localmente usando `chrome.storage.local`
- Nenhuma análise, telemetria ou rastreamento é implementado

### Permissões Utilizadas
- `storage`: Armazena preferências do usuário (nível de intensidade)
- `host_permissions`: Acesso apenas a Instagram, TikTok e YouTube para aplicar filtros visuais

### Recursos Acessíveis
- `calm.mp3`: Áudio de relaxamento reproduzido localmente

### Segurança
- Não executa código remoto
- Não faz requisições HTTP/HTTPS externas
- Não acessa cookies ou dados de autenticação
- Não modifica conteúdo das páginas além dos filtros visuais e controles de mídia

### Código Aberto
Todo o código é auditável e não contém ofuscação.
