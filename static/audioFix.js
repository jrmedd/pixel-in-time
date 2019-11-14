/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function () {
  const list = []; 
  self.AudioContext = new Proxy(self.AudioContext, {
    construct(target, args) {
      const result =  new target(...args);
      list.push(result);
      return result;
    }   
  }); 

  const btn = document.createElement('button');
  btn.classList.add('unmute');
  btn.style.position = 'fixed';
  btn.style.bottom = '0';
  btn.style.right = '0';
  btn.textContent = '🔇 Unmute';
  btn.style.fontSize = '2rem';
  btn.onclick = e => {
    list.forEach(ctx => ctx.resume());
    btn.remove();
  };  
  document.addEventListener('DOMContentLoaded', _ => {
    document.body.appendChild(btn);
  }); 
})();