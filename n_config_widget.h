#ifndef N_CONFIG_WIDGET_H
#define N_CONFIG_WIDGET_H

#include "njson.h"
#include <QDir>
#include <QWidget>

namespace Ui {
class NConfigWidget;
}

class NConfigWidget : public QWidget
{
    Q_OBJECT

public:
    enum SCENE_COL {SCENE_COL_ID, SCENE_COL_CLASS, SCENE_COL_CLASS_FILE, SCENE_COL_LAYOUT, SCENE_COL_PAGE};
    explicit NConfigWidget(QWidget *parent = 0);
    void setCurrentProject(QString dirPath);
    ~NConfigWidget();

private:
    Ui::NConfigWidget *ui;
    QDir *mProjectDir;
    QString mProjectName;
    NJson mConfigApp;
    NJson mConfigScene;
    NJson mConfigPage;

private slots:
    void saveConfig();
    void newScene();
    void removeScene();

    void contextMenuForConfigApp(QPoint point);
    void contextMenuForConfigScene(QPoint point);

    void syncAppJsonToWidget();
    void syncSceneJsonToWidget();

    void syncAppWidgetToJson();
    void syncSceneWidgetToJson();

    void editConfigAppJson();
    void editConfigSceneJson();
};

#endif // N_CONFIG_WIDGET_H
