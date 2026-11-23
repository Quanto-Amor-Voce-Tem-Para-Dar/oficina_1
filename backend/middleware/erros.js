// Padronização dos erros de todas as rotas: { status: 'ERRO', mensagem, erros? }.

// Use nas rotas para devolver um erro esperado:  throw new ErroApi(404, 'Ação não encontrada.')
class ErroApi extends Error {
    constructor(statusHttp, mensagem, erros) {
        super(mensagem);
        this.statusHttp = statusHttp;
        this.erros = erros;
    }
}

function tratarErros(error, req, res, next) {
    if (error instanceof ErroApi) {
        const corpo = { status: 'ERRO', mensagem: error.message };
        if (error.erros) corpo.erros = error.erros;
        return res.status(error.statusHttp).json(corpo);
    }
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({ status: 'ERRO', mensagem: 'O corpo da requisição não é um JSON válido.' });
    }
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ status: 'ERRO', mensagem: 'Registro duplicado (já existe um igual).' });
    }
    if (String(error.message).includes('invalid_grant')) {
        return res.status(502).json({
            status: 'ERRO',
            mensagem: 'O acesso ao Google Agenda expirou. Um administrador precisa conectar a conta do projeto de novo em Configurações.',
        });
    }

    console.error('Erro inesperado:', error);
    return res.status(500).json({ status: 'ERRO', mensagem: 'Erro interno no servidor.' });
}

function rotaNaoEncontrada(req, res) {
    res.status(404).json({ status: 'ERRO', mensagem: `Rota não encontrada: ${req.method} ${req.path}` });
}

module.exports = { ErroApi, tratarErros, rotaNaoEncontrada };
