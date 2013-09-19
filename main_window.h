#ifndef MAIN_WINDOW_H
#define MAIN_WINDOW_H

#include "jobject.h"
#include <QMainWindow>
#include <QDir>

namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    static bool cpDir(const QString &srcPath, const QString &dstPath);

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
    void saveConfig();

    void contextMenuForConfigApp(QPoint point);
    void syncAppWidgetToJson();
    void editConfigAppJson();

    void contextMenuForConfigScene(QPoint point);
    void editConfigSceneJson();
    void syncSceneWidgetToJson();
    void newScene();
    void removeScene();
};

#endif // MAIN_WINDOW_H
