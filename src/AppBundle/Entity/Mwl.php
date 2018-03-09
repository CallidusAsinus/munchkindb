<?php

namespace AppBundle\Entity;

/**
 * Mwl
 */
class Mwl implements \Serializable
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var string
     */
    private $code;

    /**
     * @var string
     */
    private $name;

    /**
     * @var \DateTime
     */
    private $dateStart;

    /**
     * @var boolean
     */
    private $active;

    /**
     * @var array
     */
    private $cards;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $legalities;

    /**
     * @var \DateTime
     */
    private $dateCreation;

    /**
     * @var \DateTime
     */
    private $dateUpdate;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->active = false;
    }

    public function toString()
    {
        return $this->name;
    }

    public function serialize()
    {
        return [
            'id'            => $this->id,
            'date_creation' => $this->dateCreation ? $this->dateCreation->format('c') : null,
            'date_update'   => $this->dateUpdate ? $this->dateUpdate->format('c') : null,
            'code'          => $this->code,
            'name'          => $this->name,
            'active'        => $this->active,
            'date_start'    => $this->dateStart ? $this->dateStart->format('Y-m-d') : null,
            'cards'         => $this->cards,
        ];
    }

    public function unserialize($serialized)
    {
        throw new \Exception("unserialize() method unsupported");
    }

    /**
     * Get id
     *
     * @return integer
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Get code
     *
     * @return string
     */
    public function getCode()
    {
        return $this->code;
    }

    /**
     * Set code
     *
     * @param string $code
     *
     * @return Mwl
     */
    public function setCode($code)
    {
        $this->code = $code;

        return $this;
    }

    /**
     * Get name
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Set name
     *
     * @param string $name
     *
     * @return Mwl
     */
    public function setName($name)
    {
        $this->name = $name;

        return $this;
    }

    /**
     * Get dateStart
     *
     * @return \DateTime
     */
    public function getDateStart()
    {
        return $this->dateStart;
    }

    /**
     * Set dateStart
     *
     * @param \DateTime $dateStart
     *
     * @return Mwl
     */
    public function setDateStart($dateStart)
    {
        $this->dateStart = $dateStart;

        return $this;
    }

    /**
     * Get active
     *
     * @return boolean
     */
    public function getActive()
    {
        return $this->active;
    }

    /**
     * Set active
     *
     * @param boolean $active
     *
     * @return Mwl
     */
    public function setActive($active)
    {
        $this->active = $active;

        return $this;
    }

    /**
     * Add legality
     *
     * @param \AppBundle\Entity\Legality $legality
     *
     * @return Mwl
     */
    public function addLegality(\AppBundle\Entity\Legality $legality)
    {
        $this->legalities[] = $legality;

        return $this;
    }

    /**
     * Remove legality
     *
     * @param \AppBundle\Entity\Legality $legality
     */
    public function removeLegality(\AppBundle\Entity\Legality $legality)
    {
        $this->legalities->removeElement($legality);
    }

    /**
     * Get legalities
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getLegalities()
    {
        return $this->legalities;
    }

    /**
     * Get dateCreation
     *
     * @return \DateTime
     */
    public function getDateCreation()
    {
        return $this->dateCreation;
    }

    /**
     * Set dateCreation
     *
     * @param \DateTime $dateCreation
     *
     * @return Mwl
     */
    public function setDateCreation($dateCreation)
    {
        $this->dateCreation = $dateCreation;

        return $this;
    }

    /**
     * Get dateUpdate
     *
     * @return \DateTime
     */
    public function getDateUpdate()
    {
        return $this->dateUpdate;
    }

    /**
     * Set dateUpdate
     *
     * @param \DateTime $dateUpdate
     *
     * @return Mwl
     */
    public function setDateUpdate($dateUpdate)
    {
        $this->dateUpdate = $dateUpdate;

        return $this;
    }

    /**
     * @return array
     */
    public function getCards()
    {
        return $this->cards;
    }

    /**
     * @param array $cards
     *
     * @return self
     */
    public function setCards($cards)
    {
        $this->cards = $cards;

        return $this;
    }
}
