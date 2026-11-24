"""Original CodeQuest orbital theme preview. No samples or third-party music."""
import numpy as np
from scipy import signal
from scipy.io import wavfile
from pathlib import Path
SR=44100; BPM=104; beat=60/BPM; bar=4*beat; length=16*bar+4
rng=np.random.default_rng(2048)
mix=np.zeros((int(length*SR),2),np.float64)
def hz(m):return 440*2**((m-69)/12)
def put(x,start,level=1,pan=0):
 i=int(start*SR); n=min(len(x),len(mix)-i)
 if n<=0:return
 p=(pan+1)*np.pi/4
 if x.ndim==1:mix[i:i+n,0]+=x[:n]*level*np.cos(p);mix[i:i+n,1]+=x[:n]*level*np.sin(p)
 else:mix[i:i+n]+=x[:n]*level

def env(t,d,a=.02,r=.3):return np.minimum(t/max(a,.001),1)*np.minimum(np.maximum(d-t,0)/max(r,.001),1)
def pad(m,d):
 t=np.arange(int(d*SR))/SR; f=hz(m); out=[]
 for side in [-1,1]:
  x=sum(np.sin(2*np.pi*f*(1+side*.0015+k*.0006)*t+k*.7)/5 for k in [-2,-1,0,1,2])
  x+=.17*np.sin(2*np.pi*f*2*t+.1*np.sin(t*2))+.045*np.sin(2*np.pi*f*3*t)
  out.append(x*env(t,d,.65,.8)*(.88+.12*np.sin(t*1.2+side)))
 return np.stack(out,axis=1)
def keys(m,d):
 t=np.arange(int(d*SR))/SR;f=hz(m)
 mod=2.2*np.exp(-t*3)*np.sin(2*np.pi*f*2*t)
 x=np.sin(2*np.pi*f*t+mod)*np.exp(-t*2.5)+.12*np.sin(2*np.pi*f*3*t)*np.exp(-t*6)
 return x*env(t,d,.006,.15)
def lead(m,d):
 t=np.arange(int(d*SR))/SR;f=hz(m)
 phase=2*np.pi*f*t+.025*np.sin(2*np.pi*4.7*t)
 x=np.sin(phase)+.22*np.sin(2*phase)*np.exp(-t*3)+.07*np.sin(3*phase)
 return x*env(t,d,.035,.18)*(.65+.35*np.exp(-t*2))
def bass(m,d):
 t=np.arange(int(d*SR))/SR;f=hz(m)
 return (np.sin(2*np.pi*f*t)+.15*np.sin(2*np.pi*f*2*t))*env(t,d,.015,.1)*np.exp(-t*.8)
def kick():
 t=np.arange(int(.36*SR))/SR
 phase=2*np.pi*(45*t+70*.028*(1-np.exp(-t/.028)))
 return np.sin(phase)*np.exp(-t*15)*env(t,.36,.003,.025)
def noise(d,cut,decay):
 t=np.arange(int(d*SR))/SR;x=rng.normal(0,1,len(t));x=signal.sosfilt(signal.butter(2,cut,fs=SR,btype='highpass',output='sos'),x)
 return x*np.exp(-t*decay)*env(t,d,.002,.02)
# D major9, B minor7, G major9 and A suspended resolving into A major.
chords=[[50,57,61,64,69],[47,54,57,62,66],[43,50,54,57,62],[45,52,57,62,64]]
roots=[38,35,31,33]
phrases=[[(0,74,.7),(1,78,.45),(1.75,81,.8),(3,78,.7)],[(.25,76,.5),(1,74,.6),(2,73,.45),(2.75,69,.9)],[(0,71,.65),(1,74,.4),(1.75,78,.8),(3,76,.6)],[(0,73,.5),(1,76,.5),(2,74,1.6)]]
for b in range(16):
 start=b*bar;c=chords[b%4];energy=1
 for j,m in enumerate(c):put(pad(m,bar+.6),start,.032*energy,0)
 # Broken electric-piano voicing with alternating stereo placement.
 if True:
  for k in range(8):
   m=c[[0,2,3,1,4,3,2,4][k]]+12
   put(keys(m,.85),start+k*.5*beat,.065*energy,(-1 if k%2 else 1)*.36)
 if True:
  for off,d in [(0,1.3),(1.5,.4),(2,1.3),(3.5,.4)]:put(bass(roots[b%4],d*beat),start+off*beat,.15*energy)
 if True:
  for off in [0,2,2.75] if b%2 else [0,1.5,2]:put(kick(),start+off*beat,.2*energy)
  for off in [1,3]:
   put(noise(.19,1400,28),start+off*beat,.045*energy,.08)
   put(keys(50,.12),start+off*beat,.024)
  for k in range(8):put(noise(.06,7000,80),start+(k*.5+(0.025 if k%2 else 0))*beat,.019 if k%2 else .012,(-1 if k%2 else 1)*.5)
 # A singable four-bar phrase, varied in the second statement.
 if True:
  phrase=phrases[(b-3)%4]
  for off,m,d in phrase:
   if b%8>=4 and off==0:m+=12
   put(lead(m,d*beat+.18),start+off*beat,.09,-.08)
   if b%8>=4:put(lead(m-12,d*beat+.15),start+off*beat+.012,.019,.25)
 # Sparse high bell answers at the phrase endings.
 if b in [2,6,10,14]:
  for off,m in [(2.5,86),(3.25,81)]:put(keys(m,1.5),start+off*beat,.048,.6)
# Stereo tempo delay and diffuse multi-tap room. Send tails never become a new loop.
dry=mix.copy()
for seconds,gain,swap in [(beat*.75,.18,True),(beat*1.5,.09,False),(.071,.09,True),(.113,.07,False),(.173,.05,True),(.257,.04,False),(.389,.035,True)]:
 n=int(seconds*SR);mix[n:]+=dry[:-n,::-1] *gain if swap else dry[:-n]*gain
# Remove infrasonic rumble, gentle saturation, fades; normalization in ffmpeg.
mix=signal.sosfilt(signal.butter(2,32,fs=SR,btype='highpass',output='sos'),mix,axis=0)
mix=np.tanh(mix*1.15)
period=int(16*bar*SR)
tail=mix[period:].copy();mix=mix[:period];mix[:len(tail)]+=tail
# The period is snapped to a sample; duplicate endpoint interpolation removes residual DC discontinuity.
diff=mix[-1]-mix[0]
n=256;mix[-n:]-=np.linspace(0,1,n)[:,None]*diff
peak=np.max(np.abs(mix));mix*=.88/max(peak,.001)
Path('/downloads').mkdir(exist_ok=True)
wavfile.write('/downloads/codequest-orbit-loop.wav',SR,(mix*32767).astype(np.int16))
print(f'Original stereo arrangement, {BPM} BPM, {length:.1f}s, peak before mastering {peak:.3f}')
