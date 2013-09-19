#ifndef MAIN_WINDOW_H
#define MAIN_WINDOW_H

#include "njson.h"
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
    NJson mConfigApp;
    NJson mConfigScene;
    NJson mConfigPage;

    void setCurrentProject(QString dirPath);

private slots:
    void openProject();
    void newProject();

    void saveConfig();
    void newScene();
    void removeScene();

    void contextMenuForConfigApp(QPoint point);
    void contextMenuForConfigScene(QPoint point);

    void syncAppWidgetToJson();
    void syncSceneWidgetToJson();

    void editConfigAppJson();
    void editConfigSceneJson();
};

#endif // MAIN_WINDOW_H
