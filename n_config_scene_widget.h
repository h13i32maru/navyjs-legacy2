#ifndef N_CONFIG_SCENE_WIDGET_H
#define N_CONFIG_SCENE_WIDGET_H

#include "n_file_widget.h"
#include "util/n_json.h"

#include <QTreeWidgetItem>

namespace Ui {
class NConfigSceneWidget;
}

class NConfigSceneWidget : public NFileWidget
{
    Q_OBJECT

public:
    enum SCENE_COL {SCENE_COL_ID, SCENE_COL_CLASS, SCENE_COL_CLASS_FILE, SCENE_COL_LAYOUT, SCENE_COL_PAGE, SCENE_COL_BGCOLOR};
    explicit NConfigSceneWidget(const QDir &projectDir, const QString &filePath, QWidget *parent = 0);
    ~NConfigSceneWidget();

protected:
    virtual bool innerSave();

private:
    Ui::NConfigSceneWidget *ui;
    NJson mConfigScene;

private slots:
    void newScene();
    void removeScene();
    void contextMenu(QPoint point);
    void showRawData();
    void syncJsonToTree();
    void showSceneDialog(const QModelIndex &index);
};

#endif // N_CONFIG_SCENE_WIDGET_H
