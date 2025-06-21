# 🚀 Como Executar o Sistema de Estoque

## ⚠️ PROBLEMA: Timeout de Conexão?

Se você está vendo erros de **timeout** ou **backend desconectado**, significa que o servidor backend não está rodando. Siga os passos abaixo:

## 📝 Passos Rápidos

### 1. Instalar Dependências do Backend

**Abra um terminal/PowerShell e execute:**

```bash
cd backend
pip install -r requirements.txt
```

### 2. Iniciar o Backend

**No mesmo terminal, execute:**

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**✅ Você deve ver algo como:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxx] using StatReload
INFO:     Started server process [xxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 3. Instalar Dependências do Frontend (Novo Terminal)

**Abra outro terminal/PowerShell e execute:**

```bash
cd frontend
npm install
```

### 4. Iniciar o Frontend

```bash
npm run dev
```

**✅ Você deve ver algo como:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 5. Acessar o Sistema

Abra seu navegador em: **http://localhost:5173**

## 🔧 Configuração do MongoDB

Certifique-se de que o MongoDB está rodando:

- **Windows:** Inicie o serviço MongoDB
- **Mac/Linux:** Execute `mongod`
- **Docker:** `docker run -d -p 27017:27017 mongo`

## 📋 Checklist de Problemas

✅ **Backend rodando?** - Deve estar em `http://localhost:8000`  
✅ **Frontend rodando?** - Deve estar em `http://localhost:5173`  
✅ **MongoDB rodando?** - Porta padrão `27017`  
✅ **Dependências instaladas?** - `pip install -r requirements.txt` e `npm install`  

## 🎯 Testando a Conexão

1. Acesse http://localhost:8000/docs - Deve mostrar a documentação da API
2. Na página de exportação, o status deve mostrar "Conectado" (verde)

## 🔥 Funcionalidades Implementadas

Depois de executar corretamente, você terá acesso a:

### ✅ **Exportação Excel** (Principal)
- 📊 Produtos com filtros
- 📋 Transações de estoque
- 📈 Histórico de atividades
- 📑 Relatório completo

### ✅ **Gestão de Produtos**
- 🏷️ Cadastro completo
- 🏪 Categorias e fornecedores
- 📏 Unidades de medida
- 🏷️ Códigos de barras automáticos
- 📱 QR Codes

### ✅ **Controle de Estoque**
- ⚠️ Alertas de estoque baixo
- 📝 Registro de perdas/danos/devoluções
- 📊 Dashboard com estatísticas
- 📋 Histórico de atividades

## ❗ Comandos de Emergência

Se algo der errado:

```bash
# Reinstalar dependências backend
cd backend
pip install --force-reinstall -r requirements.txt

# Reinstalar dependências frontend
cd frontend
npm install --force

# Limpar cache npm
npm cache clean --force
```

## 🆘 Ainda com Problemas?

1. **Verifique as portas:** 8000 (backend) e 5173 (frontend) devem estar livres
2. **Firewall:** Pode estar bloqueando as conexões
3. **Antivírus:** Pode estar interferindo
4. **Python:** Certifique-se de ter Python 3.8+
5. **Node.js:** Certifique-se de ter Node.js 16+

## 🔗 URLs Importantes

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Exportação:** http://localhost:5173/export

---

**📧 Se ainda tiver problemas, verifique se todas as dependências foram instaladas corretamente!** 