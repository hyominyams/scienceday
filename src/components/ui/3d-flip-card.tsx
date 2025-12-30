'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardImage {
  src: string
  alt: string
  title?: string
  description?: string
  badge?: string
  actionLabel?: string
  status?: 'active' | 'coming'
}

interface CardStackProps {
  images: CardImage[]
  className?: string
  cardWidth?: number
  cardHeight?: number
  spacing?: {
    x?: number
    y?: number
  }
  onCardSelect?: (index: number) => void
}

interface CardProps extends CardImage {
  index: number
  isHovered: boolean
  isFirstCard?: boolean
  isMobile: boolean
  isFront?: boolean
  onClick: (index: number) => void
  onSelect?: (index: number) => void
  width: number
  height: number
  spacing: { x?: number; y?: number }
}

const Card = ({
  src,
  alt,
  title,
  description,
  badge,
  actionLabel,
  status,
  index,
  isHovered,
  isMobile,
  isFront,
  onClick,
  onSelect,
  width,
  height,
  spacing,
}: CardProps) => {
  const handleClick = () => {
    onClick(index)
    if (onSelect) onSelect(index)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleClick()
    }
  }

  return (
    <motion.div
      className={cn('card-stack-card', isFront && 'is-front')}
      style={{
        width,
        height,
        transformStyle: 'preserve-3d',
        transformOrigin: isMobile ? 'top center' : 'left center',
        zIndex: isFront ? 20 : 5 - index,
        filter: isFront ? 'none' : 'blur(5px)',
      }}
      initial={{
        rotateY: 0,
        x: 0,
        y: 0,
        scale: 1,
        boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.1)',
      }}
      animate={
        isFront
          ? {
              scale: 1.2,
              rotateY: 0,
              x: 0,
              y: isMobile ? 0 : -50,
              z: 50,
              boxShadow: '0px 15px 40px rgba(0, 0, 0, 0.5)',
            }
          : isHovered
            ? {
                rotateY: isMobile ? 0 : -45,
                x: isMobile ? 0 : index * (spacing.x ?? 50),
                y: isMobile ? index * (spacing.y ?? 50) : index * -5,
                z: index * 15,
                scale: 1.05,
                boxShadow: `10px 20px 30px rgba(0, 0, 0, ${0.2 + index * 0.05})`,
                transition: { type: 'spring', stiffness: 300, damping: 50, delay: index * 0.1 },
              }
            : {
                rotateY: 0,
                x: 0,
                y: 0,
                z: 0,
                scale: 1,
                boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.1)',
                transition: { type: 'spring', stiffness: 300, damping: 20, delay: (4 - index) * 0.1 },
              }
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={title ?? alt}
    >
      <img src={src} alt={alt} className="card-stack-image" />
      {(title || description || badge) && (
        <div className={cn('card-stack-overlay', status === 'coming' && 'is-muted')}>
          <div className="card-stack-meta">
            {badge && <span className="card-stack-badge">{badge}</span>}
            {title && <h3 className="card-stack-title">{title}</h3>}
            {description && <p className="card-stack-desc">{description}</p>}
          </div>
          {actionLabel && <span className="card-stack-action">{actionLabel}</span>}
        </div>
      )}
    </motion.div>
  )
}

export function CardStack3D({
  images,
  className,
  cardWidth = 320,
  cardHeight = 192,
  spacing = { x: 50, y: 50 },
  onCardSelect,
}: CardStackProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [frontCardIndex, setFrontCardIndex] = useState(0)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setFrontCardIndex((idx) => {
      if (!images.length) return 0
      return Math.min(idx, Math.max(images.length - 1, 0))
    })
  }, [images.length])

  if (!images.length) return null

  const handlePrev = () => setFrontCardIndex((idx) => (idx - 1 + images.length) % images.length)
  const handleNext = () => setFrontCardIndex((idx) => (idx + 1) % images.length)

  return (
    <div className={cn('card-stack-wrap', className)}>
      <div
        className="relative perspective-1000"
        style={{ width: cardWidth, height: cardHeight }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {images.map((image, index) => (
          <Card
            key={index}
            {...image}
            index={index}
            isHovered={isHovered}
            isFirstCard={index === 0}
            isMobile={isMobile}
            isFront={frontCardIndex === index}
            onClick={(idx) => setFrontCardIndex(idx)}
            onSelect={onCardSelect}
            width={cardWidth}
            height={cardHeight}
            spacing={spacing}
          />
        ))}
      </div>
      <div className="card-stack-controls" aria-label="체험 카드 넘기기">
        <button className="card-nav-btn" type="button" onClick={handlePrev} aria-label="이전 체험">
          {'<'} 이전
        </button>
        <span className="card-stack-status">
          {frontCardIndex + 1} / {images.length}
        </span>
        <button className="card-nav-btn" type="button" onClick={handleNext} aria-label="다음 체험">
          다음 {'>'}
        </button>
      </div>
    </div>
  )
}
