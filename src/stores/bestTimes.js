import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { useFirestore, useCollection } from 'vuefire'
import { defineStore } from 'pinia'

export const useBestTimesStore = defineStore('bestTimes', () => {
  // Firebase data.
  const db = useFirestore()
  const allEntries = useCollection(collection(db, 'bestTimes'))

  // Getters.
  const getSortedTimes = () => {
    return [...allEntries.value].sort((a, b) => b.time - a.time)
  }

  // Actions.
  const addScore = async (payload) => {
    return await addDoc(collection(db, 'bestTimes'), {
      ...payload,
    })
  }

  return {
    allEntries,
    getSortedTimes,
    addScore,
  }
})
