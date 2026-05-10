FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy custom settings with alternative mirror
COPY settings.xml /root/.m2/settings.xml
COPY pom.xml .

# Download dependencies
RUN --mount=type=cache,target=/root/.m2/repository \
    mvn -B -ntp -DskipTests dependency:resolve dependency:resolve-plugins

COPY src ./src
RUN --mount=type=cache,target=/root/.m2/repository \
    mvn -B -ntp -DskipTests package

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
