// session-create.js
document.addEventListener('DOMContentLoaded', init);

async function init(){
  const userId = requireAuth(); if(!userId) return;
  document.getElementById('btn-cancel-session').addEventListener('click', ()=> history.back());
  document.getElementById('btn-create-session').addEventListener('click', onCreate);

  await loadComplexities();
}

async function loadComplexities(){
  const min = document.getElementById('s-complex-min');
  const max = document.getElementById('s-complex-max');
  min.innerHTML = max.innerHTML = '<option>Carregando...</option>';
  try{
    const res = await fetchJson(apiUrl('/api/Game/complexidades'));
    if(!res.ok){ min.innerHTML = max.innerHTML = '<option>Erro</option>'; return; }
    const list = await res.json();
    min.innerHTML = max.innerHTML = '';
    list.forEach(c=>{
      const id = c.id ?? c.Id;
      const desc = c.descricao ?? c.Descricao;
      const o1 = document.createElement('option'); o1.value = id; o1.textContent = desc;
      const o2 = document.createElement('option'); o2.value = id; o2.textContent = desc;
      min.appendChild(o1); max.appendChild(o2);
    });
  }catch{
    min.innerHTML = max.innerHTML = '<option>Erro</option>';
  }
}

async function onCreate(){
  const userId = requireAuth(); if(!userId) return;
  const idade = parseInt(document.getElementById('s-idade').value || '');
  const dur = parseInt(document.getElementById('s-duracao').value || '');
  const qtd = parseInt(document.getElementById('s-qtd').value || '');
  const complexMin = parseInt(document.getElementById('s-complex-min').value || '');
  const complexMax = parseInt(document.getElementById('s-complex-max').value || '');

  const msg = document.getElementById('session-message'); msg.textContent = '';
  if(isNaN(idade) || isNaN(dur) || isNaN(qtd) || isNaN(complexMin) || isNaN(complexMax)){
    msg.textContent = 'Todos os campos são obrigatórios.';
    return;
  }

  const payload = {
    IdUsuario: userId,
    IdadeJogadorMaisNovo: idade,
    DuracaoMinutos: dur,
    QtdJogadores: qtd,
    NivelComplexidadeMinima: complexMin,
    NivelComplexidadeMaxima: complexMax
  };

  try{
    const res = await fetchJson(apiUrl('/api/Session/create'), { method: 'POST', body: JSON.stringify(payload) });
    if(res.status === 201){ location.href = 'dashboard.html'; return; }
    const e = await res.text(); msg.textContent = e || 'Falha ao criar sessão.';
  }catch{
    msg.textContent = 'Erro de rede.';
  }
}