import { useEffect, useState } from 'react';
export function useLocalStorage<T>(key:string, initial:T){const [value,setValue]=useState<T>(()=>{try{const r=localStorage.getItem(key);return r?JSON.parse(r):initial}catch{return initial}});useEffect(()=>{localStorage.setItem(key,JSON.stringify(value))},[key,value]);return [value,setValue] as const}
