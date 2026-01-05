FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package

# Boot jar'ı seçmek için: plain varsa ele
RUN ls -lah target && \
    JAR=$(ls -1 target/*.jar | grep -vE '(-plain\.jar)$' | head -n 1) && \
    echo "Selected jar: $JAR" && \
    cp "$JAR" /app/app.jar

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/app.jar /app/app.jar
EXPOSE 9090
ENTRYPOINT ["java","-jar","/app/app.jar"]
