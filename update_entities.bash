# Add isInvisible to Ability
sed -i '/private Boolean isHarmful;/a \    @JsonProperty("isInvisible")\n    private Boolean isInvisible;' /mnt/hdd/Code/db-arena/db-arena-java/src/main/java/com/pecodigos/dbarena/ingame/entities/Ability.java
# Add invisible to ActiveEffect
sed -i '/private boolean isHarmful;/a \    private boolean invisible;' /mnt/hdd/Code/db-arena/db-arena-java/src/main/java/com/pecodigos/dbarena/ingame/battle/models/ActiveEffect.java
