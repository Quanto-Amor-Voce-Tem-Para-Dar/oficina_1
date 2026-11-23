// Login dos usuários do sistema (RF19) e restrição por perfil (RF20 / RNF03).
// O front manda o token no cabeçalho:  Authorization: Bearer <token>
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRA_EM } = require('../config');
const { consulta } = require('../db/conexao');
const { ErroApi } = require('./erros');

function gerarToken(usuario) {
    return jwt.sign({ id: usuario.id_usuario, perfil: usuario.perfil }, JWT_SECRET, { expiresIn: JWT_EXPIRA_EM });
}

// Exige um usuário logado e ATIVO. Coloca os dados dele em req.usuario.
async function exigirLogin(req, res, next) {
    if (req.usuario) return next(); // já validado por outro router nesta mesma requisição

    const [tipo, token] = (req.headers.authorization || '').split(' ');
    if (tipo !== 'Bearer' || !token) throw new ErroApi(401, 'Você precisa entrar no sistema.');

    let dados;
    try {
        dados = jwt.verify(token, JWT_SECRET);
    } catch {
        throw new ErroApi(401, 'Sessão expirada. Entre novamente.');
    }

    const [usuario] = await consulta(
        'SELECT id_usuario, nome, email, perfil, status FROM Usuario WHERE id_usuario = ?',
        [dados.id]
    );
    if (!usuario || usuario.status !== 'ATIVO') throw new ErroApi(401, 'Usuário inativo ou removido.');

    req.usuario = usuario;
    next();
}

function exigirAdmin(req, res, next) {
    if (req.usuario?.perfil !== 'ADMINISTRADOR') {
        throw new ErroApi(403, 'Apenas administradores podem fazer isso.');
    }
    next();
}

const ehAdmin = (usuario) => usuario?.perfil === 'ADMINISTRADOR';

// O próprio usuário ou um administrador (ex.: ver/editar a disponibilidade de alguém).
function exigirProprioOuAdmin(param = 'id') {
    return (req, res, next) => {
        if (!ehAdmin(req.usuario) && Number(req.params[param]) !== req.usuario.id_usuario) {
            throw new ErroApi(403, 'Você só pode acessar os seus próprios dados.');
        }
        next();
    };
}

module.exports = { gerarToken, exigirLogin, exigirAdmin, exigirProprioOuAdmin, ehAdmin };
