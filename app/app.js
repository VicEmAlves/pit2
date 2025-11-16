const API_BASE_URL = 'https://vic-api-dgbma8eqbqcnegg3.brazilsouth-01.azurewebsites.net';

// DOM elements
const el = {
    // login
    loginNick: document.getElementById('login-nick'),
    loginPass: document.getElementById('login-pass'),
    btnLogin: document.getElementById('btn-login'),
    loginMessage: document.getElementById('login-message'),
    // register
    btnShowRegister: document.getElementById('btn-show-register'),
    registerView: document.getElementById('register-view'),
    registerNick: document.getElementById('reg-nick'),
    registerPass: document.getElementById('reg-pass'),
    registerQuestion: document.getElementById('reg-question'),
    registerAnswer: document.getElementById('reg-answer'),
    btnRegister: document.getElementById('btn-register'),
    registerMessage: document.getElementById('register-message'),
    btnBackToLogin1: document.getElementById('btn-back-to-login-1'),
    // forgot
    btnShowForgot: document.getElementById('btn-show-forgot'),
    forgotView: document.getElementById('forgot-view'),
    fpNick: document.getElementById('fp-nick'),
    btnGetQuestion: document.getElementById('btn-get-question'),
    fpMsg1: document.getElementById('fp-msg-1'),
    fpStep1: document.getElementById('fp-step1'),
    fpStep2: document.getElementById('fp-step2'),
    fpQuestion: document.getElementById('fp-question'),
    fpAnswer: document.getElementById('fp-answer'),
    btnValidateAnswer: document.getElementById('btn-validate-answer'),
    fpMsg2: document.getElementById('fp-msg-2'),
    fpStep3: document.getElementById('fp-step3'),
    fpNewPass: document.getElementById('fp-newpass'),
    btnChangePassword: document.getElementById('btn-change-password'),
    fpMsg3: document.getElementById('fp-msg-3'),
    btnBackToLogin2: document.getElementById('btn-back-to-login-2'),
    btnBackToLogin3: document.getElementById('btn-back-to-login-3'),
    btnBackToStep1: document.getElementById('btn-back-to-step1'),
    // views
    loginView: document.getElementById('login-view')
};

function qs(path){ return API_BASE_URL + path; }

function showView(viewId){
    // hide all primary views
    ['login-view','register-view','forgot-view'].forEach(id=>{
        const n = document.getElementById(id);
        if(n) n.classList.add('hidden');
    });
    const v = document.getElementById(viewId);
    if(v) v.classList.remove('hidden');
}

async function fetchJson(url, opts){
    const res = await fetch(url, Object.assign({headers:{'Content-Type':'application/json'}}, opts));
    return res;
}

async function init(){
    // events
    el.btnLogin.addEventListener('click', onLogin);
    el.btnShowRegister.addEventListener('click', async () => {
        showView('register-view');
        await loadSecurityQuestions();
    });
    el.btnBackToLogin1.addEventListener('click', ()=> showView('login-view'));
    el.btnShowForgot.addEventListener('click', ()=> {
        showView('forgot-view');
        // reset forgot flow
        el.fpStep1.classList.remove('hidden');
        el.fpStep2.classList.add('hidden');
        el.fpStep3.classList.add('hidden');
        el.fpMsg1.textContent = el.fpMsg2.textContent = el.fpMsg3.textContent = '';
        el.fpNick.value = '';
        el.fpAnswer.value = '';
        el.fpNewPass.value = '';
    });
    el.btnBackToLogin2.addEventListener('click', ()=> showView('login-view'));
    el.btnBackToLogin3.addEventListener('click', ()=> showView('login-view'));
    el.btnBackToStep1.addEventListener('click', ()=> {
        el.fpStep1.classList.remove('hidden');
        el.fpStep2.classList.add('hidden');
    });

    el.btnRegister.addEventListener('click', onRegister);
    el.btnGetQuestion.addEventListener('click', onGetSecurityQuestion);
    el.btnValidateAnswer.addEventListener('click', onValidateAnswer);
    el.btnChangePassword.addEventListener('click', onChangePassword);

    showView('login-view');
}

// LOGIN
async function onLogin(){
    el.loginMessage.textContent = '';
    const nick = el.loginNick.value?.trim();
    const pass = el.loginPass.value ?? '';

    if(!nick || !pass){
        el.loginMessage.textContent = 'NickName e Senha são obrigatórios.';
        return;
    }

    try{
        const res = await fetchJson(qs('/api/Login/login'), {
            method: 'POST',
            body: JSON.stringify({ NickName: nick, Senha: pass })
        });

        if(!res.ok){
            el.loginMessage.textContent = 'NickName ou Senha incorreta.';
            return;
        }

        const text = await res.text();
        const userId = text?.replace(/"/g,'').trim();
        if(!userId){
            el.loginMessage.textContent = 'Login failed.';
            return;
        }

        sessionStorage.setItem('userId', userId);
        el.loginMessage.style.color = 'green';
        el.loginMessage.textContent = 'Login realizado com sucesso. Redirecionando...';

        setTimeout(()=> {
            window.location.href = 'dashboard.html';
        }, 700);

    }catch(err){
        el.loginMessage.textContent = 'Network error.';
        console.error(err);
    }
}

// REGISTER
async function loadSecurityQuestions(){
    el.registerMessage.textContent = '';
    try{
        const res = await fetchJson(qs('/api/Login/security-questions'), { method: 'GET' });
        if(!res.ok) {
            el.registerQuestion.innerHTML = '<option>Erro ao carregar</option>';
            return;
        }
        const arr = await res.json();
        el.registerQuestion.innerHTML = '';
        arr.forEach((q)=> {
            const opt = document.createElement('option');
            opt.value = q.id ?? q.Id ?? q.IdPerguntaSeguranca ?? q.Id;
            opt.textContent = q.descricao ?? q.Descricao ?? q.DescricaoPergunta ?? q.Descricao;
            el.registerQuestion.appendChild(opt);
        });
    }catch(e){
        el.registerQuestion.innerHTML = '<option>Erro</option>';
    }
}

async function onRegister(){
    el.registerMessage.textContent = '';
    const nick = el.registerNick.value?.trim();
    const pass = el.registerPass.value ?? '';
    const idPerg = el.registerQuestion.value;
    const answer = el.registerAnswer.value?.trim();

    if(!nick || !pass || !idPerg || !answer){
        el.registerMessage.textContent = 'Todos os campos são obrigatórios.';
        return;
    }

    try{
        const payload = {
            NickName: nick,
            Senha: pass,
            IdPerguntaSeguranca: parseInt(idPerg,10),
            RespostaPergunta: answer
        };
        const res = await fetchJson(qs('/api/Login/register'), {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if(res.status === 201){
            el.registerMessage.style.color = 'green';
            el.registerMessage.textContent = 'Cadastro realizado com sucesso. Voltando ao Login...';
            setTimeout(()=> showView('login-view'), 900);
            return;
        }

        // read error
        const errText = await res.text();
        el.registerMessage.textContent = errText || 'Cadastro falhou.';
    }catch(err){
        el.registerMessage.textContent = 'Erro Interno.';
    }
}

// FORGOT PASSWORD
async function onGetSecurityQuestion(){
    el.fpMsg1.textContent = '';
    const nick = el.fpNick.value?.trim();
    if(!nick){
        el.fpMsg1.textContent = 'NickName é obrigatório.';
        return;
    }

    try{
        const res = await fetchJson(qs(`/api/Login/security-question/${encodeURIComponent(nick)}`), { method: 'GET' });
        if(res.status === 404){
            el.fpMsg1.textContent = 'Usuário não encontrado.';
            return;
        }
        if(!res.ok){
            el.fpMsg1.textContent = 'Erro ao buscar pergunta de segurança.';
            return;
        }
        const question = await res.text();
        el.fpQuestion.textContent = question || '—';
        // move to step 2
        el.fpStep1.classList.add('hidden');
        el.fpStep2.classList.remove('hidden');
    }catch(err){
        el.fpMsg1.textContent = 'Erro de Conexão.';
    }
}

async function onValidateAnswer(){
    el.fpMsg2.textContent = '';
    const nick = el.fpNick.value?.trim();
    const answer = el.fpAnswer.value ?? '';
    if(!nick || !answer){
        el.fpMsg2.textContent = 'NickName e Resposta são obrigatórios.';
        return;
    }

    try{
        const res = await fetchJson(qs('/api/Login/validate-security-answer'), {
            method: 'POST',
            body: JSON.stringify({ NickName: nick, Resposta: answer })
        });
        if(!res.ok){
            el.fpMsg2.textContent = 'Validação falhou.';
            return;
        }
        const ok = await res.json();
        if(!ok){
            el.fpMsg2.textContent = 'Resposta incorreta.';
            return;
        }
        // show new password field
        el.fpStep2.classList.add('hidden');
        el.fpStep3.classList.remove('hidden');
    }catch(err){
        el.fpMsg2.textContent = 'Erro Interno.';
    }
}

async function onChangePassword(){
    el.fpMsg3.textContent = '';
    const nick = el.fpNick.value?.trim();
    const newPass = el.fpNewPass.value ?? '';
    if(!nick || !newPass){
        el.fpMsg3.textContent = 'NickName e Nova Senha são obrigatórios.';
        return;
    }

    try{
        const res = await fetchJson(qs('/api/Login/change-password'), {
            method: 'POST',
            body: JSON.stringify({ NickName: nick, NovaSenha: newPass })
        });
        if(res.ok){
            el.fpMsg3.style.color = 'green';
            el.fpMsg3.textContent = 'Senha alterada. Voltando para o login...';
            setTimeout(()=> showView('login-view'), 900);
            return;
        }
        if(res.status === 404){
            el.fpMsg3.textContent = 'User not found.';
            return;
        }
        const err = await res.text();
        el.fpMsg3.textContent = err || 'Erro ao trocar a senha.';
    }catch(err){
        el.fpMsg3.textContent = 'Erro interno.';
    }
}

// initialize
document.addEventListener('DOMContentLoaded', init);