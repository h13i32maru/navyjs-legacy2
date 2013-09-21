#ifndef N_CODE_WIDGET_H
#define N_CODE_WIDGET_H

#include <QDir>
#include <QFileSystemModel>
#include <QFileSystemWatcher>
#include <QModelIndex>
#include <QWidget>

namespace Ui {
class NCodeWidget;
}

class NCodeWidget : public QWidget
{
    Q_OBJECT

public:
    explicit NCodeWidget(QWidget *parent = 0);
    void setCurrentProject(QString dirPath);
    void saveAllFile();
    bool saveFile(int tabIndex);
    ~NCodeWidget();

private:
    Ui::NCodeWidget *ui;
    QDir *mProjectDir;
    QString mProjectName;
    QFileSystemModel *mFileSysteMmodel;

    QList<int> searchTabIndexesByPath(const QString &path, const bool &isDir);
    bool isTextChanged(int tabIndex);

private slots:
    void contextMenu(QPoint point);
    void openFile(QModelIndex index);
    void closeFile(int tabIndex);
    void newFile();
    void newDir();
    void deletePath();
    void renamePath();
    void copyPath();
    void updateTabForPathChanged(const QString &oldPath, const QString &newPath);
    void updateTabForDropped(QString dropDirPath, QString selectedFilePath);
    void updateTabForTextChanged();
    void updateTabForPathDeleted(const QString &path, const bool &isDir);
};

#endif // N_CODE_WIDGET_H
