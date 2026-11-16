const H=`// Pocket C++ IDE Umbrella Header for Competitive Programming
#pragma once

// C Standard Library Includes
#include <cassert>
#include <cctype>
#include <cerrno>
#include <cfloat>
#include <climits>
#include <cmath>
#include <cstdarg>
#include <cstddef>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <cstdint>

// C++ Standard Library Includes
#include <algorithm>
#include <array>
#include <bitset>
#include <chrono>
#include <complex>
#include <deque>
#include <functional>
#include <iomanip>
#include <ios>
#include <iosfwd>
#include <iostream>
#include <istream>
#include <iterator>
#include <limits>
#include <list>
#include <locale>
#include <map>
#include <memory>
#include <new>
#include <numeric>
#include <ostream>
#include <queue>
#include <random>
#include <ratio>
#include <set>
#include <sstream>
#include <stack>
#include <stdexcept>
#include <streambuf>
#include <string>
#include <tuple>
#include <type_traits>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <valarray>
#include <vector>
`,X=/^(.*?):(\d+):(\d+):\s+(error|warning|note):\s+(.*)$/;function z(a){const i=[],t=a.split(`
`);for(const c of t){const s=c.trim().match(X);s&&i.push({file:s[1],line:parseInt(s[2],10),col:parseInt(s[3],10),severity:s[4],message:s[5],raw:c.trim()})}return i}let I=null;async function A(){if(I)return{runClang:I.runClang,initDurationMs:0};const a=performance.now();I=await import("/clang/bundle.js");const t=performance.now()-a;return{runClang:I.runClang,initDurationMs:t}}function J(a){let i=8,t=0,c=null,s=0;function l(){let n=0,o=0;for(;i<a.length;){const r=a[i++];if(n|=(r&127)<<o,o+=7,!(r&128))break}return n}for(;i<a.length;){const n=a[i++],o=l(),r=i;if(n===5){if(l()>0){const u=l();t=l(),u&1&&(c=l())}}else n===11&&(s=o);i=r+o}return{wasmInitialMemoryMb:t*64/1024,wasmMaxMemoryMb:c!==null?c*64/1024:null,globalDataSizeBytes:s,wasmBinarySizeBytes:a.byteLength}}self.onmessage=async a=>{const i=a.data;if(i.type==="PRELOAD"){try{const{runClang:t}=await A();await t(["clang","--version"],{},{}),self.postMessage({type:"PRELOAD_SUCCESS"})}catch{}return}if(i.type==="COMPILE"){const{runId:t,sourceName:c,sourceCode:s,additionalFiles:l,options:n}=i;let o="";const r=new TextDecoder;let f=0,u=0,L=0,E=0;try{self.postMessage({type:"COMPILE_STAGE",runId:t,stage:"initializing"});const y=await A(),b=y.runClang;f=y.initDurationMs,u=performance.now();const m=n.language==="cpp",p=m?"clang++":"clang",w=n.initialMemoryMb||128,x=n.maxMemoryMb||256,D=n.stackSizeMb||16,P=w*1024*1024,R=x*1024*1024,T=D*1024*1024,_={[c]:s,...m?{bits:{"stdc++.h":H}}:{}};if(l)for(const[e,k]of Object.entries(l))if(e.includes("/")){const d=e.split("/");let g=_;for(let M=0;M<d.length-1;M++)g[d[M]]=g[d[M]]||{},g=g[d[M]];g[d[d.length-1]]=k}else _[e]=k;const O={stdout:e=>{e&&(o+=r.decode(e))},stderr:e=>{e&&(o+=r.decode(e))},fetchProgress:e=>{e&&e.totalLength>0&&self.postMessage({type:"COMPILE_PROGRESS",runId:t,progress:{doneLength:e.doneLength,totalLength:e.totalLength,percent:Math.min(100,Math.round(e.doneLength/e.totalLength*100))}})}};self.postMessage({type:"COMPILE_STAGE",runId:t,stage:"compiling"});const W=performance.now(),h="main.o",$=[p,"-c",...m?["-fno-exceptions","-I."]:[],`-std=${n.standard}`,`-${n.optimization}`,...n.warnings?["-Wall","-Wextra"]:[],...n.extraFlags||[],c,"-o",h],U=await b($,_,O);L=performance.now()-W;const B=U[h];if(!B||!(B instanceof Uint8Array))throw new Error("Compilation produced no intermediate object file");self.postMessage({type:"COMPILE_STAGE",runId:t,stage:"linking"});const G=performance.now(),j=[p,`-Wl,-z,stack-size=${T}`,`-Wl,--initial-memory=${P}`,`-Wl,--max-memory=${R}`,"-Wl,--export=__heap_base,--export=__data_end",h,"-o","out.wasm"],v={[h]:B},F=await b(j,v,O);E=performance.now()-G;const S=F["out.wasm"];if(!S||!(S instanceof Uint8Array))throw new Error("Linking produced no executable WebAssembly output");const q=performance.now()-u,N=z(o),C=J(S);self.postMessage({type:"COMPILE_SUCCESS",runId:t,wasmBinary:S,diagnostics:N,output:o,durationMs:q,compilerInitDurationMs:f,sourceCompilationDurationMs:L,linkingDurationMs:E,wasmInitialMemoryMb:C.wasmInitialMemoryMb,wasmMaxMemoryMb:C.wasmMaxMemoryMb,globalDataSizeBytes:C.globalDataSizeBytes,wasmBinarySizeBytes:C.wasmBinarySizeBytes})}catch(y){const b=u>0?performance.now()-u:0,m=z(o);let p=y?.message||"Compilation failed";const w=o.match(/initial memory too small, (\d+) bytes needed/);if(w){const x=parseInt(w[1],10),D=Math.ceil(x/(1024*1024)),P=Math.round(n.initialMemoryMb||128);p=`Program memory requirement (${D} MB) exceeds configured WASM memory limit (${P} MB initial). Please increase WASM Initial Memory in Settings.`}self.postMessage({type:"COMPILE_ERROR",runId:t,diagnostics:m,output:o,durationMs:b,compilerInitDurationMs:f,sourceCompilationDurationMs:L,linkingDurationMs:E,errorMessage:p})}}};
