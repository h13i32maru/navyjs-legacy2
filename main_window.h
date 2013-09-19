#ifndef MAIN_WINDOW_H
#define MAIN_WINDOW_H

#include "jobject.h"
#include <QMainWindow>
#include <QDir>
#include <QTreeWidgetItem>

namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    static bool cpDir(const QString &srcPath, const QString &dstPath);

    static QJsonValue jsonValue(QJsonObject object, QString keys);
    static int jsonInt(QJsonObject object, QString keys);
    static QString jsonStr(QJsonObject object, QString keys);
    static QJsonObject setValue(QJsonObject obj, QString keyStr, QJsonValue value);

    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();

private:
    Ui::MainWindow *ui;
    QString mProjectName;
    QDir *mProjectDir;
    JObject mConfigApp;
    JObject mConfigScene;
    JObject mConfigPage;

    void setCurrentProject(QString dirPath);

private slots:
    void openProject();
    void newProject();
    void updateConfigAppEditText();
    void updateConfigScene(QTreeWidgetItem *item, int columnIndex);
    void saveConfig();
    void contextMenuForConfigScene(QPoint point);
    void newScene();
    void removeScene();
};

#endif // MAIN_WINDOW_H
