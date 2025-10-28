<template>
  <div
    class="poker-card"
    :class="{
      'selected': isSelected,
      'revealed': isRevealed,
      'hidden': !isRevealed && hasValue,
      'selectable': isSelectable
    }"
    @click="handleClick"
  >
    <div class="card-front">
      <div class="card-value">{{ displayValue }}</div>
    </div>
    <div class="card-back">
      <div class="card-pattern">?</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: [String, Number],
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  isRevealed: {
    type: Boolean,
    default: false
  },
  hasValue: {
    type: Boolean,
    default: false
  },
  isSelectable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['select'])

const displayValue = computed(() => {
  if (props.value === '?' || props.value === 'coffee') {
    return props.value === 'coffee' ? '☕' : '?'
  }
  return props.value
})

const handleClick = () => {
  if (props.isSelectable) {
    emit('select', props.value)
  }
}
</script>

<style scoped>
.poker-card {
  position: relative;
  width: 80px;
  height: 110px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  /* Transitions uniquement pour box-shadow et border, PAS pour transform */
  transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              border 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  user-select: none;
}

.poker-card.selectable {
  /* Transition pour hover uniquement sur les cartes sélectionnables */
  transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              border 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.poker-card.selectable:hover {
  transform: translateY(-8px) scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.poker-card.selected {
  border: 3px solid #42b983;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.4);
}

.poker-card.hidden {
  /* Rotation instantanée sans transition */
  transform: rotateY(180deg);
}

.poker-card.selectable:active {
  transform: scale(0.95);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-front {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 2px solid #e9ecef;
}

.card-back {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: rotateY(180deg);
}

.card-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
}

.card-pattern {
  font-size: 2.5rem;
  color: white;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Animation pour les cartes révélées */
.poker-card.revealed.hidden {
  animation: flip 0.6s ease-in-out forwards;
}

@keyframes flip {
  0% {
    transform: rotateY(180deg);
  }
  100% {
    transform: rotateY(0deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .poker-card {
    width: 60px;
    height: 85px;
  }

  .card-value {
    font-size: 1.5rem;
  }

  .card-pattern {
    font-size: 2rem;
  }
}
</style>
